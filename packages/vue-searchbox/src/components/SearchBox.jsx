import VueTypes from 'vue-types';
import SearchComponent from './SearchComponent.jsx';
import { types } from '../utils/types';
import Input from '../styles/Input';
import DownShift from './DownShift.jsx';
import {
	equals,
	getClassName,
	debounce as debounceFunc,
	hasQuerySuggestionsRenderer,
	getQuerySuggestionsComponent,
	hasCustomRenderer,
	getComponent
} from '../utils/helper';
import {
	suggestions as suggestionsStyle,
	suggestionsContainer
} from '../styles/Suggestions';
import SuggestionItem from '../addons/SuggestionItem.jsx';
import Title from '../styles/Title';
import Icons from './Icons.jsx';
import causes from '../utils/causes';

const SearchBox = {
	name: 'search-box',
	inject: ['searchbase'],
	props: {
		// search component props
		index: VueTypes.string,
		url: VueTypes.string,
		credentials: VueTypes.string,
		headers: VueTypes.object,
		appbaseConfig: types.appbaseConfig,
		transformRequest: VueTypes.func,
		transformResponse: VueTypes.func,
		beforeValueChange: VueTypes.func,
		enableQuerySuggestions: VueTypes.bool,
		showDistinctSuggestions: types.showDistinctSuggestions,
		URLParams: VueTypes.bool,
		// RS API properties
		id: VueTypes.string.isRequired,
		value: VueTypes.any,
		type: types.queryTypes,
		react: types.reactType,
		queryFormat: types.queryFormat,
		dataField: types.dataField,
		categoryField: VueTypes.string,
		categoryValue: VueTypes.string,
		nestedField: VueTypes.string,
		from: VueTypes.number,
		size: VueTypes.number,
		sortBy: types.sortType,
		aggregationField: VueTypes.string,
		after: VueTypes.object,
		includeNullValues: VueTypes.bool,
		includeFields: types.sourceFields,
		excludeFields: types.sourceFields,
		fuzziness: types.fuzziness,
		searchOperators: VueTypes.bool,
		highlight: VueTypes.bool,
		highlightField: VueTypes.string,
		customHighlight: VueTypes.object,
		interval: VueTypes.number,
		aggregations: VueTypes.arrayOf(VueTypes.string),
		missingLabel: VueTypes.string,
		showMissing: VueTypes.bool,
		defaultQuery: VueTypes.func,
		customQuery: VueTypes.func,
		enableSynonyms: VueTypes.bool,
		selectAllLabel: VueTypes.string,
		pagination: VueTypes.bool,
		queryString: VueTypes.bool,
		// subscribe on changes,
		subscribeTo: VueTypes.arrayOf(VueTypes.string),
		triggerQueryOnInit: VueTypes.bool.def(true),
		// searchbox specific
		title: types.title,
		defaultValue: types.defaultValue,
		placeholder: types.placeholder,
		showIcon: types.showIcon,
		iconPosition: types.iconPosition,
		icon: types.icon,
		showClear: types.showClear,
		clearIcon: types.clearIcon,
		autosuggest: types.autosuggest,
		strictSelection: types.strictSelection,
		defaultSuggestions: types.defaultSuggestions,
		debounce: types.debounce,
		showVoiceSearch: types.showVoiceSearch,
		render: types.render,
		renderError: types.renderError,
		renderNoSuggestion: types.renderNoSuggestion,
		renderQuerySuggestions: types.renderQuerySuggestions,
		renderMic: types.renderMic,
		innerClass: types.innerClass,
		className: types.className,
		loader: types.loader,
		autoFocus: types.autoFocus,
		// Internal props from search component
		loading: VueTypes.bool,
		error: VueTypes.any,
		micStatus: VueTypes.string,
		instanceValue: VueTypes.string
	},
	data() {
		this.state = {
			isOpen: false
		};
		return this.state;
	},
	computed: {
		hasCustomRenderer() {
			return hasCustomRenderer(this);
		},
		stats() {
			const { results } = this.$props;
			const total = results.numberOfResults;
			const { time, hidden, promotedData } = results;
			const size = this.$props.size || 10;
			return {
				numberOfResults: total,
				...(size > 0 ? { numberOfPages: Math.ceil(total / size) } : null),
				time,
				hidden,
				promoted: promotedData && promotedData.length
			};
		}
	},
	methods: {
		getComponentInstance() {
			const { id } = this.$props;
			return this.searchbase.getComponent(id);
		},
		getQuerySuggestionsList() {
			const { suggestions } = this.getComponentInstance();
			return (suggestions || []).filter(
				suggestion => suggestion._query_suggestion
			);
		},
		getSuggestionsList() {
			const { defaultSuggestions, instanceValue } = this.$props;
			if (!instanceValue && defaultSuggestions) {
				return defaultSuggestions;
			}
			const { suggestions } = this.getComponentInstance();
			return (suggestions || []).filter(
				suggestion => !suggestion._query_suggestion
			);
		},
		_applySetter(prev, next, setterFunc) {
			if (!equals(prev, next)) {
				const component = this.getComponentInstance();
				component[setterFunc](next);
			}
		},
		triggerClickAnalytics(clickPosition, isSuggestion = true, value) {
			const component = this.getComponentInstance();
			if (!component) return;
			if (
				component
        && component.appbaseSettings
        && component.appbaseSettings.recordAnalytics
			) {
				component.recordClick({ [value]: clickPosition }, isSuggestion);
			}
		},
		onValueSelectedHandler(currentValue = this.$props.instanceValue, ...cause) {
			this.$emit('valueSelected', currentValue, ...cause);
		},
		onInputChange(event) {
			this.setValue({ value: event.target.value, event });
		},
		onSuggestionSelected(suggestion) {
			this.setValue({
				value: suggestion && suggestion.value,
				isOpen: false,
				triggerCustomQuery: true
			});
			this.triggerClickAnalytics(
				suggestion && suggestion._click_id,
				true,
				suggestion.source && suggestion.source._id
			);
			this.onValueSelectedHandler(
				suggestion.value,
				causes.SUGGESTION_SELECT,
				suggestion.source
			);
		},
		triggerDefaultQuery() {
			const componentInstance = this.getComponentInstance();
			if(componentInstance) {
				componentInstance.triggerDefaultQuery();
			}
		},
		triggerCustomQuery() {
			const componentInstance = this.getComponentInstance();
			if(componentInstance) {
				componentInstance.triggerCustomQuery();
			}
		},
		setValue({ value, isOpen = true, ...rest }) {
			const { debounce } = this.$props;
			this.isOpen = isOpen;
			const componentInstance = this.getComponentInstance();
			if (debounce > 0) {
				componentInstance.setValue(value, {
					triggerDefaultQuery: false,
					triggerCustomQuery: false,
					stateChanges: true
				});
				debounceFunc(this.triggerDefaultQuery, debounce);
				if(rest.triggerCustomQuery) {
					debounceFunc(this.triggerCustomQuery, debounce);
				}
			} else {
				this.triggerSuggestionsQuery(value, rest.triggerCustomQuery);
			}
		},
		triggerSuggestionsQuery(value, triggerCustomQuery) {
			const componentInstance = this.getComponentInstance();
			if (componentInstance) {
				componentInstance.setValue(value || '', {
					triggerCustomQuery,
					triggerDefaultQuery: true,
					stateChanges: true
				});
			}
		},
		handleFocus(event) {
			this.isOpen = true;
			this.$emit('focus', event);
		},
		handleStateChange(changes) {
			const { isOpen } = changes;
			this.isOpen = isOpen;
		},
		handleKeyDown(event, highlightedIndex) {
			// if a suggestion was selected, delegate the handling
			// to suggestion handler
			if (event.key === 'Enter' && highlightedIndex === null) {
				this.setValue({ value: event.target.value, isOpen: false, triggerCustomQuery: true });
				this.onValueSelectedHandler(event.target.value, causes.ENTER_PRESS);
			}

			this.$emit('keyDown', event);
		},
		handleMicClick() {
			const componentInstance = this.getComponentInstance();
			componentInstance.onMicClick(null);
		},
		renderIcons() {
			const {
				iconPosition,
				showClear,
				clearIcon,
				innerClass,
				showVoiceSearch,
				icon,
				showIcon
			} = this.$props;
			const { instanceValue, micStatus } = this.$props;
			return (
				<Icons
					clearValue={this.clearValue}
					iconPosition={iconPosition}
					showClear={showClear}
					clearIcon={clearIcon}
					currentValue={instanceValue}
					handleSearchIconClick={this.handleSearchIconClick}
					icon={icon}
					showIcon={showIcon}
					innerClass={innerClass}
					enableVoiceSearch={showVoiceSearch}
					micStatus={micStatus}
					handleMicClick={this.handleMicClick}
				/>
			);
		},
		renderNoSuggestionComponent() {
			const {
				innerClass,
				renderError,
				loading,
				error,
				instanceValue
			} = this.$props;
			const { isOpen } = this.$data;
			const suggestionsList = this.getSuggestionsList();
			const renderNoSuggestion
        = this.$scopedSlots.renderNoSuggestion || this.$props.renderNoSuggestion;
			if (
				renderNoSuggestion
        && isOpen
        && !suggestionsList.length
        && !loading
        && instanceValue
        && !(renderError && error)
			) {
				return (
					<div
						class={`no-suggestions ${getClassName(innerClass, 'noSuggestion')}`}
					>
						{typeof renderNoSuggestion === 'function'
							? renderNoSuggestion(instanceValue)
							: renderNoSuggestion}
					</div>
				);
			}
			return null;
		},
		renderErrorComponent() {
			const { innerClass, error, loading, instanceValue } = this.$props;
			const renderError
        = this.$scopedSlots.renderError || this.$props.renderError;
			if (error && renderError && instanceValue && !loading) {
				return (
					<div class={getClassName(innerClass, 'error')}>
						{typeof renderError === 'function'
							? renderError(error)
							: renderError}
					</div>
				);
			}
			return null;
		},
		clearValue() {
			this.setValue({ value: '', isOpen: false, triggerCustomQuery: true });
			this.onValueSelectedHandler(null, causes.CLEAR_VALUE);
		},
		handleSearchIconClick() {
			const { instanceValue } = this.$props;
			if (instanceValue.trim()) {
				this.setValue({
					value: instanceValue,
					isOpen: false,
					triggerCustomQuery: true
				});
				this.onValueSelectedHandler(instanceValue, causes.SEARCH_ICON_CLICK);
			}
		},
		getBackgroundColor(highlightedIndex, index) {
			return highlightedIndex === index ? '#eee' : '#fff';
		},
		getComponent(downshiftProps = {}, isQuerySuggestionsRender = false) {
			const { instanceValue, loading, error, results } = this.$props;
			const querySuggestionsList = this.getQuerySuggestionsList();
			const suggestionsList = this.getSuggestionsList();
			const data = {
				loading,
				error,
				value: instanceValue,
				downshiftProps,
				data: suggestionsList,
				promotedData: results.promotedData,
				customData: results.customData,
				resultStats: this.stats,
				rawData: results.rawData,
				querySuggestions: querySuggestionsList,
				triggerClickAnalytics: this.triggerClickAnalytics
			};
			if (isQuerySuggestionsRender) {
				return getQuerySuggestionsComponent(
					{
						downshiftProps,
						data: querySuggestionsList,
						value: instanceValue,
						loading,
						error
					},
					this
				);
			}
			return getComponent(data, this);
		}
	},
	render() {
		const {
			className,
			innerClass,
			showIcon,
			showClear,
			iconPosition,
			title,
			defaultSuggestions,
			autosuggest,
			placeholder,
			autoFocus,
			innerRef,
			size,
			instanceValue
		} = this.$props;
		const suggestionsList = this.getSuggestionsList();
		const querySuggestionsList = this.getQuerySuggestionsList();
		return (
			<div class={className}>
				{title && (
					<Title class={getClassName(innerClass, 'title') || ''}>{title}</Title>
				)}
				{defaultSuggestions || autosuggest ? (
					<DownShift
						id="searchbox-downshift"
						handleChange={this.onSuggestionSelected}
						handleMouseup={this.handleStateChange}
						isOpen={this.isOpen}
						scopedSlots={{
							default: ({
								getInputEvents,
								getInputProps,
								getItemProps,
								getItemEvents,
								isOpen,
								highlightedIndex
							}) => (
								<div class={suggestionsContainer}>
									<Input
										id="search-box"
										showIcon={showIcon}
										showClear={showClear}
										iconPosition={iconPosition}
										class={getClassName(innerClass, 'input')}
										placeholder={placeholder}
										currentValue={instanceValue}
										{...{
											on: getInputEvents({
												onInput: this.onInputChange,
												onBlur: e => {
													this.$emit('blur', e);
												},
												onFocus: this.handleFocus,
												onKeyPress: e => {
													this.$emit('keyPress', e);
												},
												onKeyDown: e => this.handleKeyDown(e, highlightedIndex),
												onKeyUp: e => {
													this.$emit('keyUp', e);
												}
											})
										}}
										{...{
											domProps: getInputProps({
												value: instanceValue || ''
											})
										}}
									/>
									{this.renderIcons()}
									{this.hasCustomRenderer
                    && this.getComponent({
                    	isOpen,
                    	getItemProps,
                    	getItemEvents,
                    	highlightedIndex
                    })}
									{this.renderErrorComponent()}
									{!this.hasCustomRenderer
                  && isOpen
                  && suggestionsList.length ? (
											<ul
												class={`${suggestionsStyle} ${getClassName(
													innerClass,
													'list'
												)}`}
											>
												{hasQuerySuggestionsRenderer(this)
													? this.getComponent(
														{
															isOpen,
															getItemProps,
															getItemEvents,
															highlightedIndex
														},
														true
													)
													: querySuggestionsList.map((sugg, index) => (
														<li
															{...{
																domProps: getItemProps({
																	item: sugg
																})
															}}
															{...{
																on: getItemEvents({
																	item: sugg
																})
															}}
															key={`${index + 1}-${sugg.value}`}
															style={{
																backgroundColor: this.getBackgroundColor(
																	highlightedIndex,
																	index
																)
															}}
														>
															<SuggestionItem
																currentValue={instanceValue}
																suggestion={sugg}
															/>
														</li>
													))}
												{suggestionsList.slice(0, size).map((item, index) => (
													<li
														{...{
															domProps: getItemProps({ item })
														}}
														{...{
															on: getItemEvents({
																item
															})
														}}
														key={`${index + querySuggestionsList.length + 1}-${
															item.value
														}`}
														style={{
															backgroundColor: this.getBackgroundColor(
																highlightedIndex,
																index + querySuggestionsList.length
															)
														}}
													>
														<SuggestionItem
															currentValue={instanceValue}
															suggestion={item}
														/>
													</li>
												))}
											</ul>
										) : (
											this.renderNoSuggestionComponent()
										)}
								</div>
							)
						}}
					/>
				) : (
					<div class={suggestionsContainer}>
						<Input
							class={getClassName(innerClass, 'input') || ''}
							placeholder={placeholder}
							{...{
								on: {
									blur: e => {
										this.$emit('blur', e);
									},
									keypress: e => {
										this.$emit('keyPress', e);
									},
									input: this.onInputChange,
									focus: e => {
										this.$emit('focus', e);
									},
									keydown: e => {
										this.$emit('keyDown', e);
									},
									keyup: e => {
										this.$emit('keyUp', e);
									}
								}
							}}
							{...{
								domProps: {
									autofocus: autoFocus,
									value: instanceValue || ''
								}
							}}
							iconPosition={iconPosition}
							showIcon={showIcon}
							showClear={showClear}
							innerRef={innerRef}
						/>
						{this.renderIcons()}
					</div>
				)}
			</div>
		);
	}
};

const SearchBoxWrapper = {
	name: 'search-box-wrapper',
	functional: true,
	render(h, context) {
		return (
			<SearchComponent
				value=""
				triggerQueryOnInit={false}
				{...{
					on: context.listeners,
					props: context.props,
					scopedSlots: {
						default: ({ loading, error, micStatus, results, value }) => {
							return (
								<SearchBox
									loading={loading}
									error={error}
									micStatus={micStatus}
									results={results}
									instanceValue={value}
									{...{
										attrs: context.data.attrs,
										on: context.listeners,
										scopedSlots: context.scopedSlots,
										slots: context.slots
									}}
								/>
							);
						}
					}
				}}
				subscribeTo={[
					'micStatus',
					'error',
					'requestPending',
					'results',
					'value'
				]}
			/>
		//  Hi! Search component
		//  </SearchComponent>
		);
	}
};

SearchBoxWrapper.install = function(Vue) {
	Vue.component(SearchBox.name, SearchBoxWrapper);
};

export default SearchBoxWrapper;
